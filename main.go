package main

import (
	"flag"
	"log"
	"os"
	"os/signal"

	"github.com/mijia/web-starter-kit/web"
)

func main() {
	var webAddress string
	var isDebug bool
	var debugAssetsPort string
	flag.StringVar(&webAddress, "web", ":9000", "Web address server listening on")
	flag.StringVar(&debugAssetsPort, "devWeb", "", "Web address server listening on (like :9010)")
	flag.BoolVar(&isDebug, "debug", false, "Debug mode")
	flag.Parse()

	server, err := web.NewServer(isDebug)
	if err != nil {
		log.Fatalf("Cannot init the server instance, %s", err)
	}
	if isDebug && debugAssetsPort != "" {
		server.SetAssetDomain("//localhost" + debugAssetsPort )
	}
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, os.Kill)
	go func() {
		s := <-c
		log.Printf("Got signal: %s", s)
		server.Cleanup()
	}()

	log.Fatal(server.ListenAndServe(webAddress))
}
