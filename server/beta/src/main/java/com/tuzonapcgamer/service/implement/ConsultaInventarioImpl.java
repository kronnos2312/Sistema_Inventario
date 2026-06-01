package com.tuzonapcgamer.service.implement;

import com.tuzonapcgamer.dto.ConsultaInventarioDTO;
import com.tuzonapcgamer.model.ConsultaInventario;
import com.tuzonapcgamer.model.InventoryItem;
import com.tuzonapcgamer.repository.ConsultaInventarioREP;
import com.tuzonapcgamer.repository.InventoryItemREP;
import com.tuzonapcgamer.service.facade.ConsultaInventarioService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ConsultaInventarioImpl implements ConsultaInventarioService {

    @Autowired private ConsultaInventarioREP repository;
    @Autowired private InventoryItemREP inventoryRepository;

    @Override
    public List<ConsultaInventario> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<ConsultaInventario> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<ConsultaInventario> getByInventarioId(Long inventarioId) {
        return repository.findByInventarioId(inventarioId);
    }

    @Override
    public List<ConsultaInventario> getByNumero(String numero) {
        return repository.findByNumero(numero);
    }

    @Override
    public ConsultaInventarioDTO save(ConsultaInventarioDTO dto) {
        ConsultaInventarioDTO validated = validate(dto);
        if ("error".equals(validated.getCodeName())) return validated;

        InventoryItem inventario = resolveInventario(dto.getInventarioId());
        if (inventario == null) return error(dto, "No existe inventario con ID: " + dto.getInventarioId());

        ConsultaInventario entity = dto.cast();
        entity.setId(null);
        entity.setInventario(inventario);
        repository.save(entity);

        dto.setCodeName("success");
        dto.setMessageName("Consulta registrada exitosamente.");
        return dto;
    }

    @Override
    public ConsultaInventarioDTO update(ConsultaInventarioDTO dto) {
        if (dto.getId() == null) return error(dto, "El ID es requerido para actualizar.");

        ConsultaInventarioDTO validated = validate(dto);
        if ("error".equals(validated.getCodeName())) return validated;

        ConsultaInventario entity = repository.findById(dto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Consulta no encontrada con ID: " + dto.getId()));

        InventoryItem inventario = resolveInventario(dto.getInventarioId());
        if (inventario == null) return error(dto, "No existe inventario con ID: " + dto.getInventarioId());

        entity.setNumero(dto.getNumero());
        entity.setMensaje(dto.getMensaje());
        entity.setInventario(inventario);
        repository.save(entity);

        dto.setCodeName("success");
        dto.setMessageName("Consulta actualizada exitosamente.");
        return dto;
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    private ConsultaInventarioDTO validate(ConsultaInventarioDTO dto) {
        if (dto.getNumero() == null || dto.getNumero().isBlank())
            return error(dto, "El número de consulta es obligatorio.");
        if (dto.getMensaje() == null || dto.getMensaje().isBlank())
            return error(dto, "El mensaje es obligatorio.");
        if (dto.getInventarioId() == null)
            return error(dto, "El ID del inventario es obligatorio.");
        return dto;
    }

    private InventoryItem resolveInventario(Long inventarioId) {
        return inventoryRepository.findById(inventarioId).orElse(null);
    }

    private ConsultaInventarioDTO error(ConsultaInventarioDTO dto, String message) {
        dto.setCodeName("error");
        dto.setMessageName(message);
        return dto;
    }
}
