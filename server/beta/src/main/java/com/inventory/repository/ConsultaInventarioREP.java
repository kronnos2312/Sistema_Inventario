package com.inventory.repository;

import com.inventory.model.ConsultaInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConsultaInventarioREP extends JpaRepository<ConsultaInventario, Long> {

    @Query("from ConsultaInventario c where c.inventario.id = :inventarioId")
    List<ConsultaInventario> findByInventarioId(@Param("inventarioId") Long inventarioId);

    @Query("from ConsultaInventario c where c.numero = :numero")
    List<ConsultaInventario> findByNumero(@Param("numero") String numero);
}
