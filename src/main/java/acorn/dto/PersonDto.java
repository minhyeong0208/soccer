package acorn.dto;

import java.util.Date;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PersonDto {
	private String personName;
    private String teamIdx;
    private String typeCode;
    private Date birth;
    private String nationality;
    private int backNumber;
    private String position;
    private Date contractStart;
    private Date contractEnd;
    private String personImage; // 선수 이미지 경로
    private double height;
    private double weight;
}
