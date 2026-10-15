package org.margin.server.gifs;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** KLIPY's own response is passed through unchanged; the client maps it. */
@RestController
@RequestMapping(value = "/api/gifs", produces = MediaType.APPLICATION_JSON_VALUE)
public class GifController {

    private final GifProxy gifProxy;

    public GifController(GifProxy gifProxy) {
        this.gifProxy = gifProxy;
    }

    @GetMapping("/trending")
    public String trending(@RequestParam(required = false) String page) {
        return gifProxy.trending(page);
    }

    @GetMapping("/search")
    public String search(@RequestParam String q, @RequestParam(required = false) String page) {
        return gifProxy.search(q, page);
    }
}
