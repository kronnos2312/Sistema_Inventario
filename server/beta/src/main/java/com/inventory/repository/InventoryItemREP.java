package com.inventory.repository;

import com.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface InventoryItemREP extends JpaRepository<InventoryItem, Long> {

    @Query("from InventoryItem ii where ii.arrivalDate = :arrivalDate")
    public List<InventoryItem> findByArrivalTime(@Param("arrivalDate") Date arrivalDate);

    @Query("from InventoryItem ii where ii.barcode = :barcode")
    Optional<InventoryItem> findByBarCode(@Param("barcode") String barcode);

    @Query("from InventoryItem ii where ii.outDate is null")
    List<InventoryItem> findAllInStock();

    @Query("select ii from InventoryItem ii join ii.product p join p.category c join c.groups g where ii.outDate is null and g.id = :groupId")
    List<InventoryItem> findAllInStockByGroupId(@Param("groupId") Long groupId);

}
