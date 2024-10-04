package acorn.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Ability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int abilityIdx;

    private int pass;
    private int physical;
    private int shoot;
    private int speed;
    private int dribble; 
    private int defence;

    // 측정 날짜 필드 추가
    private LocalDateTime measureDate;
    
    // 입력 타입 필드 추가 (실제값: 0, 예측값: 1)
    private int inputType;
    
    // Person과의 연관 관계 설정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_idx")
    @JsonBackReference
    @ToString.Exclude  // Lombok toString에서 순환 참조 방지
    private Person person;
}
