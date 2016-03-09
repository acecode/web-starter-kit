package web

import (
	"math/rand"
	"net/http"
	"time"

	"golang.org/x/net/context"
)

type DemoApi struct {
	BaseMuxController
}

func (api *DemoApi) MuxHandlers(m JsonMuxer) {
	m.GetJson("/api/random", "DemoApiGetRandom", api.getRandom)
}

func (api *DemoApi) getRandom(ctx context.Context, w http.ResponseWriter, r *http.Request) (int, interface{}) {
	rnd := rand.Int63()
	return http.StatusOK, wrapJsonOk(rnd)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
