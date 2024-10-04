package acorn.dto;

import java.util.Date;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransferDto {
	private String personName; // 선수명
    private Date tradingDate;
    private int price;
    private String opponent;
    private String transferMemo;
    private PersonDto person; // DTO로 Person 정보를 포함
    private int transferType;
}
