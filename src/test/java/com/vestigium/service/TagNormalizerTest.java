package com.vestigium.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class TagNormalizerTest {

    @Test
    void normalize_ShouldHandleNullAndEmpty() {
        assertThat(TagNormalizer.normalize(null)).isEmpty();
        assertThat(TagNormalizer.normalize(List.of())).isEmpty();
    }

    @Test
    void normalize_ShouldLowerCaseAndTrim() {
        var input = List.of("  Tag One  ", "TAG TWO");
        var result = TagNormalizer.normalize(input);
        
        assertThat(result).containsExactly("tag one", "tag two");
    }

    @Test
    void normalize_ShouldRemoveDuplicates() {
        var input = List.of("tag", "TAG", "  tag  ");
        var result = TagNormalizer.normalize(input);
        
        assertThat(result).containsExactly("tag");
    }

    @Test
    void normalize_ShouldCollapseWhitespace() {
        var input = List.of("tag   with   spaces");
        var result = TagNormalizer.normalize(input);
        
        assertThat(result).containsExactly("tag with spaces");
    }

    @Test
    void normalize_ShouldIgnoreBlankStrings() {
        var input = List.of("tag", "   ", "");
        var result = TagNormalizer.normalize(input);
        
        assertThat(result).containsExactly("tag");
    }
}

