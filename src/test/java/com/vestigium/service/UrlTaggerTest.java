package com.vestigium.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class UrlTaggerTest {

    @Test
    void tagsForUrl_ShouldHandleNullAndEmpty() {
        assertThat(UrlTagger.tagsForUrl(null)).isEmpty();
        assertThat(UrlTagger.tagsForUrl("")).isEmpty();
        assertThat(UrlTagger.tagsForUrl("   ")).isEmpty();
    }

    @Test
    void tagsForUrl_ShouldDetectYoutube() {
        assertThat(UrlTagger.tagsForUrl("https://www.youtube.com/watch?v=123"))
            .containsExactly("youtube");
            
        assertThat(UrlTagger.tagsForUrl("https://youtu.be/123"))
            .containsExactly("youtube");
    }

    @Test
    void tagsForUrl_ShouldDetectYoutubeShorts() {
        assertThat(UrlTagger.tagsForUrl("https://www.youtube.com/shorts/123"))
            .containsExactlyInAnyOrder("youtube", "youtube-shorts");
    }

    @Test
    void tagsForUrl_ShouldDetectRedditAndSubreddit() {
        assertThat(UrlTagger.tagsForUrl("https://www.reddit.com/r/java/comments/123"))
            .containsExactlyInAnyOrder("reddit", "java");
            
        // Case insensitivity
        assertThat(UrlTagger.tagsForUrl("https://REDDIT.com/R/JaVa/"))
            .containsExactlyInAnyOrder("reddit", "java");
    }

    @Test
    void tagsForUrl_ShouldHandleOtherDomains() {
        assertThat(UrlTagger.tagsForUrl("https://www.imdb.com/title/tt123"))
            .containsExactly("imdb");
            
        assertThat(UrlTagger.tagsForUrl("https://redgifs.com/watch/123"))
            .containsExactly("redgifs");
    }
    
    @Test
    void tagsForUrl_ShouldReturnEmptyForUnknownDomains() {
         assertThat(UrlTagger.tagsForUrl("https://example.com/something"))
            .isEmpty();
    }
}

