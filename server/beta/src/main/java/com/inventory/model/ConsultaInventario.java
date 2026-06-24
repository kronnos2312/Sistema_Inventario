package com.inventory.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "consulta_inventario")
public class ConsultaInventario extends BaseEntity {

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @ManyToOne(optional = false)
    @JoinColumn(name = "inventario_id")
    private InventoryItem inventario;

    public ConsultaInventario() {}

    public ConsultaInventario(String numero, String mensaje, InventoryItem inventario) {
        super(new Date(), null, "Sistema");
        this.numero = numero;
        this.mensaje = mensaje;
        this.inventario = inventario;
    }

    public ConsultaInventario(Date creationAt, Long creatorId, String creatorName,
                               String numero, String mensaje, InventoryItem inventario) {
        super(creationAt, creatorId, creatorName);
        this.numero = numero;
        this.mensaje = mensaje;
        this.inventario = inventario;
    }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public InventoryItem getInventario() { return inventario; }
    public void setInventario(InventoryItem inventario) { this.inventario = inventario; }
}
