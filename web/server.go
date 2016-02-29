package web

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"sync"
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
	assetsDomain string
}

func (s *Server) addMuxController(ctrl MuxController) {
	s.muxCtrls = append(s.muxCtrls, ctrl)
}

func (s *Server) ListenAndServe(addr string) error {
	if s.isDebug && s.assetsDomain != "" {
		log.Infof("Use AssetsPrefix %s", s.assetsDomain)
		s.EnableAssetsPrefix(s.assetsDomain)
	}
	s.addMuxController(&DemoApi{})
	s.addMuxController(&DemoController{})
	s.initRender()

	ignoredUrls := []string{"/bundles/", "/fonts/", "/debug/vars", "/favicon", "/robots"}
	s.Middleware(server.NewRecoveryWare(s.isDebug))
	s.Middleware(server.NewStatWare(ignoredUrls...))
	s.Middleware(server.NewRuntimeWare(ignoredUrls, true, 30*time.Minute))
	s.Middleware(s.wareWebpackAssets("webpack-assets.json", "bundles"))

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

func (s *Server) wareWebpackAssets(webpackAssetsFile string, subPath string) server.MiddleFn {
	var loadOnce sync.Once
	return func(ctx context.Context, w http.ResponseWriter, r *http.Request, next server.Handler) context.Context {
		if s.isDebug {
			s.loadWebpackAssets(webpackAssetsFile, subPath)
		} else {
			loadOnce.Do(func() {
				s.loadWebpackAssets(webpackAssetsFile, subPath)
			})
		}
		return next(ctx, w, r)
	}
}

func (s *Server) loadWebpackAssets(webpackAssetsFile string, subPath string) {
	start := time.Now()
	if data, err := ioutil.ReadFile(webpackAssetsFile); err == nil {
		var packMappings map[string]map[string]string
		if err := json.Unmarshal(data, &packMappings); err == nil {
			newMappings := make(map[string]string)
			for entry, types := range packMappings {
				for ty, target := range types {
					if subPath != "" {
						target = fmt.Sprintf("%s/%s", subPath, target)
					}
					newMappings[fmt.Sprintf("%s.%s", entry, ty)] = target
				}
			}
			s.EnableExtraAssetsMapping(newMappings)
			log.Infof("[Server] Loaded webpack assets from %s, duration=%s", webpackAssetsFile, time.Now().Sub(start))
		} else {
			log.Errorf("[Server] Failed to decode the web pack assets, %s", err)
		}
	} else {
		log.Errorf("[Server] Failed to load webpack assets from %s, %s", webpackAssetsFile, err)
	}
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

func (s *Server) SetAssetDomain(domain string){
		s.assetsDomain = domain;
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
