package com.inventory.service.facade;

import com.inventory.dto.ConsultaInventarioDTO;
import com.inventory.model.ConsultaInventario;

import java.util.List;
import java.util.Optional;

public interface ConsultaInventarioService {

    List<ConsultaInventario> getAll();

    Optional<ConsultaInventario> getById(Long id);

    List<ConsultaInventario> getByInventarioId(Long inventarioId);

    List<ConsultaInventario> getByNumero(String numero);

    ConsultaInventarioDTO save(ConsultaInventarioDTO dto);

    ConsultaInventarioDTO update(ConsultaInventarioDTO dto);

    void deleteById(Long id);
}
