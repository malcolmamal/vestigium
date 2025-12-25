package com.vestigium.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vestigium.api.dto.EntryResponse;
import com.vestigium.domain.Entry;
import com.vestigium.service.EntryService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EntriesController.class)
class EntriesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EntryService entryService;

    @Test
    @SuppressWarnings("unchecked")
    void list_ShouldReturnEntries() throws Exception {
        var entry = new Entry(
                "1", "http://example.com", "Title", "Desc", null, null, null, null, false, "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", List.of("tag1")
        );
        var response = EntryResponse.from(entry, false);
        
        when(entryService.search(any(), any(), any(), any(), any(), any(), any(), any(), anyBoolean(), anyInt(), anyInt()))
                .thenReturn(List.of(entry));
        when(entryService.toResponses(anyList())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/entries")
                        .param("q", "test")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value("1"))
                .andExpect(jsonPath("$.items[0].url").value("http://example.com"))
                .andExpect(jsonPath("$.items[0].title").value("Title"));
    }

    @Test
    void createEntry_ShouldReturnCreatedEntry() throws Exception {
        var entry = new Entry(
                "1", "http://example.com", "Title", "Desc", null, null, null, null, false, "2023-01-01T00:00:00Z", "2023-01-01T00:00:00Z", List.of("tag1")
        );
        var response = EntryResponse.from(entry, false);
        var created = new EntryService.CreatedEntry(entry, List.of());
        
        when(entryService.create(eq("http://example.com"), any(), any(), any(), anyBoolean(), any()))
                .thenReturn(created);
        when(entryService.toResponse(any())).thenReturn(response);

        mockMvc.perform(multipart("/api/entries")
                        .param("url", "http://example.com")
                        .param("title", "Title"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entry.id").value("1"))
                .andExpect(jsonPath("$.entry.url").value("http://example.com"));
    }

    @Test
    void createEntry_ShouldFailIfUrlMissing() throws Exception {
        mockMvc.perform(multipart("/api/entries")
                        .param("title", "Title")) // Missing url
                .andExpect(status().isBadRequest());
    }
}

