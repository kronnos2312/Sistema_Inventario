package com.tuzonapcgamer.dto;

import com.tuzonapcgamer.model.ConsultaInventario;

public class ConsultaInventarioDTO {

    private Long id;
    private String numero;
    private String mensaje;
    private Long inventarioId;

    private String codeName;
    private String messageName;

    public ConsultaInventarioDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public Long getInventarioId() { return inventarioId; }
    public void setInventarioId(Long inventarioId) { this.inventarioId = inventarioId; }

    public String getCodeName() { return codeName; }
    public void setCodeName(String codeName) { this.codeName = codeName; }

    public String getMessageName() { return messageName; }
    public void setMessageName(String messageName) { this.messageName = messageName; }

    public ConsultaInventario cast() {
        ConsultaInventario entity = new ConsultaInventario();
        entity.setId(this.id);
        entity.setNumero(this.numero);
        entity.setMensaje(this.mensaje);
        return entity;
    }
}
