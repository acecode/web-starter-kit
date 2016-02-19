package web

import (
	"html/template"
	"net/http"
	"time"

	"github.com/mijia/scache"
	"github.com/mijia/sweb/log"
	"github.com/mijia/sweb/render"
	"github.com/mijia/sweb/server"
	"golang.org/x/net/context"
)

type Server struct {
	*server.Server
	render   *render.Render
	muxCtrls []MuxController
	isDebug  bool
}

func (s *Server) addMuxController(ctrl MuxController) {
	s.muxCtrls = append(s.muxCtrls, ctrl)
}

func (s *Server) ListenAndServe(addr string) error {
	s.addMuxController(&DemoApi{})
	s.initRender()

	ignoredUrls := []string{"/javascripts/", "/images/", "/stylesheets/", "/fonts/", "/debug/vars", "/favicon", "/robots"}
	s.Middleware(server.NewRecoveryWare(s.isDebug))
	s.Middleware(server.NewStatWare(ignoredUrls...))
	s.Middleware(server.NewRuntimeWare(ignoredUrls, true, 30*time.Minute))

	s.Get("/debug/vars", "RuntimeStat", s.getRuntimeStat)
	s.Files("/assets/*filepath", http.Dir("public"))
	for _, mc := range s.muxCtrls {
		mc.SetResponseRender(s)
		mc.SetUrlReverser(s)
		mc.MuxHandlers(s)
	}

	return s.Run(addr)
}

func (s *Server) getRuntimeStat(ctx context.Context, w http.ResponseWriter, r *http.Request) context.Context {
	http.DefaultServeMux.ServeHTTP(w, r)
	return ctx
}

func (s *Server) initRender() {
	tSets := []*render.TemplateSet{}
	for _, mc := range s.muxCtrls {
		mcTSets := mc.GetTemplates()
		tSets = append(tSets, mcTSets...)
	}

	renderFuncs := []template.FuncMap{
		s.DefaultRouteFuncs(),
	}
	s.render = render.New(render.Options{
		Directory:     "templates",
		Funcs:         renderFuncs,
		Delims:        render.Delims{"{{", "}}"},
		IndentJson:    true,
		UseBufPool:    true,
		IsDevelopment: s.isDebug,
	}, tSets)
}

func (s *Server) RenderJsonOr500(w http.ResponseWriter, status int, v interface{}) {
	if err := s.render.Json(w, status, v); err != nil {
		log.Errorf("Server got a json rendering error, %q", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) RenderHtmlOr500(w http.ResponseWriter, status int, name string, binding interface{}) {
	if err := s.render.Html(w, status, name, binding); err != nil {
		log.Errorf("Server got a rendering error, %q", err)
		if s.isDebug {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			s.RenderServerError(w, http.StatusInternalServerError)
		}
	}
}

func (s *Server) RenderServerError(w http.ResponseWriter, status int) {
	params := map[string]interface{}{
		"Error": status,
	}
	s.RenderHtmlOr500(w, status, "error_page", params)
}

func (s *Server) GetJson(path string, name string, handle JsonHandler) {
	s.Get(path, name, s.makeJsonHandler(handle))
}

func (s *Server) PostJson(path string, name string, handle JsonHandler) {
	s.Post(path, name, s.makeJsonHandler(handle))
}

func (s *Server) PutJson(path string, name string, handle JsonHandler) {
	s.Put(path, name, s.makeJsonHandler(handle))
}

func (s *Server) PatchJson(path string, name string, handle JsonHandler) {
	s.Patch(path, name, s.makeJsonHandler(handle))
}

func (s *Server) DeleteJson(path string, name string, handle JsonHandler) {
	s.Delete(path, name, s.makeJsonHandler(handle))
}

func (s *Server) makeJsonHandler(handle JsonHandler) server.Handler {
	return func(ctx context.Context, w http.ResponseWriter, r *http.Request) context.Context {
		statusCode, data := handle(ctx, w, r)
		s.RenderJsonOr500(w, statusCode, data)
		return ctx
	}
}

func (s *Server) Cleanup() {
}

func NewServer(isDebug bool) (*Server, error) {
	if isDebug {
		log.EnableDebug()
	}

	ctx := context.Background()
	cache := scache.New(15 * time.Minute)
	ctx = context.WithValue(ctx, "memCache", cache)

	srv := &Server{
		Server:   server.New(ctx, isDebug),
		muxCtrls: []MuxController{},
		isDebug:  isDebug,
	}
	return srv, nil
}

func getMemCache(ctx context.Context) *scache.Cache {
	return ctx.Value("memCache").(*scache.Cache)
}
