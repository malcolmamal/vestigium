package com.vestigium.api;

import com.vestigium.api.dto.CreateListRequest;
import com.vestigium.api.dto.ListResponse;
import com.vestigium.service.EntryService;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ListsController {

    private final EntryService entryService;

    public ListsController(EntryService entryService) {
        this.entryService = entryService;
    }

    @GetMapping("/api/lists")
    public List<ListResponse> listAll() {
        return entryService.listAllLists().stream().map(ListResponse::from).toList();
    }

    @PostMapping("/api/lists")
    public ListResponse create(@RequestBody CreateListRequest req) {
        var created = entryService.createList(req == null ? null : req.name());
        return ListResponse.from(created);
    }

    @DeleteMapping("/api/lists/{id}")
    public void delete(@PathVariable String id, @RequestParam(value = "force", defaultValue = "false") boolean force) {
        entryService.deleteList(id, force);
    }
}


