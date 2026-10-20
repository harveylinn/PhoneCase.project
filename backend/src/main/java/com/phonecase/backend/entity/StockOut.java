package com.phonecase.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// 出庫單：唯一可以減少庫存的單據
@Entity
@Table(name = "stock_out")
public class StockOut extends BaseDocument {
}