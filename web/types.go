package web

import (
	"net/http"

	"github.com/mijia/sweb/render"
	"github.com/mijia/sweb/server"
	"golang.org/x/net/context"
)

type JsonHandler func(ctx context.Context, w http.ResponseWriter, r *http.Request) (int, interface{})

type JsonMuxer interface {
	server.Muxer
	GetJson(path string, name string, handle JsonHandler)
	PostJson(path string, name string, handle JsonHandler)
	PutJson(path string, name string, handle JsonHandler)
	PatchJson(path string, name string, handle JsonHandler)
	DeleteJson(path string, name string, handle JsonHandler)
}

type ResponseRender interface {
	RenderJsonOr500(w http.ResponseWriter, status int, v interface{})
	RenderHtmlOr500(w http.ResponseWriter, status int, name string, binding interface{})
	RenderServerError(w http.ResponseWriter, status int)
}

type UrlReverser interface {
	Reverse(name string, params ...interface{}) string
	Assets(path string) string
}

type MuxController interface {
	MuxHandlers(m JsonMuxer)
	SetResponseRender(r ResponseRender)
	SetUrlReverser(r UrlReverser)
	GetTemplates() []*render.TemplateSet
}

type BaseMuxController struct {
	ResponseRender
	UrlReverser
}

func (b *BaseMuxController) GetTemplates() []*render.TemplateSet {
	return nil
}

func (b *BaseMuxController) SetResponseRender(r ResponseRender) {
	b.ResponseRender = r
}

func (b *BaseMuxController) SetUrlReverser(r UrlReverser) {
	b.UrlReverser = r
}

type JsonData struct {
	Status  string      `json:"status"`
	Payload interface{} `json:"payload"`
}

func wrapJsonOk(payload interface{}) JsonData {
	return JsonData{
		Status:  "OK",
		Payload: payload,
	}
}

func wrapJsonError(msg string, payloads ...interface{}) JsonData {
	data := JsonData{
		Status: msg,
	}
	if len(payloads) > 0 {
		data.Payload = payloads[0]
	}
	return data
}
