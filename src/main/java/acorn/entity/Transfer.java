package acorn.entity;

import java.util.Date;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "transfer")
public class Transfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int transferIdx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_idx")
    private Person person;

    private int transferType;
    private Date tradingDate;
    private String opponent;
    private String transferMemo;
    private int price;

    @Transient
    private int personIdx;
    
    // 새로 추가된 필드: 선수 이름 저장
    private String playerName;

    // person의 personName을 가져오는 메소드 추가
    public String getPersonName() {
        return this.person != null ? this.person.getPersonName() : null;
    }
}
