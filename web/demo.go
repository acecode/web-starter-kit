package web

import (
	"net/http"

	"github.com/mijia/sweb/render"
	"golang.org/x/net/context"
)

type DemoController struct {
	BaseMuxController
}

func (c *DemoController) MuxHandlers(m JsonMuxer) {
	m.Get("/", "DemoGetIndex", c.getIndex)
}

func (c *DemoController) GetTemplates() []*render.TemplateSet {
	return []*render.TemplateSet{
		render.NewTemplateSet("demo_index", "desktop.html", "demo/index.html", "layout/desktop.html"),
	}
}

func (c *DemoController) getIndex(ctx context.Context, w http.ResponseWriter, r *http.Request) context.Context {
	c.RenderHtmlOr500(w, http.StatusOK, "demo_index", nil)
	return ctx
}
