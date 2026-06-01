package com.tuzonapcgamer.controller;

import com.tuzonapcgamer.dto.ConsultaInventarioDTO;
import com.tuzonapcgamer.model.ConsultaInventario;
import com.tuzonapcgamer.service.facade.ConsultaInventarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/consulta")
public class ConsultaInventarioController {

    @Autowired private ConsultaInventarioService service;

    @GetMapping
    public ResponseEntity<List<ConsultaInventario>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<ConsultaInventario> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/inventario/{inventarioId}")
    public ResponseEntity<List<ConsultaInventario>> getByInventario(@PathVariable Long inventarioId) {
        return ResponseEntity.ok(service.getByInventarioId(inventarioId));
    }

    @GetMapping("/numero/{numero}")
    public ResponseEntity<List<ConsultaInventario>> getByNumero(@PathVariable String numero) {
        return ResponseEntity.ok(service.getByNumero(numero));
    }

    @PostMapping
    public ResponseEntity<ConsultaInventarioDTO> create(@RequestBody ConsultaInventarioDTO dto) {
        if (dto.getId() != null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.save(dto));
    }

    @PutMapping
    public ResponseEntity<ConsultaInventarioDTO> update(@RequestBody ConsultaInventarioDTO dto) {
        if (dto.getId() == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/id/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
