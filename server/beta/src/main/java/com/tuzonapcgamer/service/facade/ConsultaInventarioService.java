package com.tuzonapcgamer.service.facade;

import com.tuzonapcgamer.dto.ConsultaInventarioDTO;
import com.tuzonapcgamer.model.ConsultaInventario;

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
