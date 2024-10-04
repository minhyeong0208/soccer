package acorn.entity;

import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
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
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int personIdx;

    private String teamIdx;
    private int facilityIdx;
    private String personName;
    private double height;
    private double weight;
    private Date birth;
    private String position;
    private int backNumber;  // Integer -> int 로 변경
    private String nationality;
    private Date contractStart;
    private Date contractEnd;
    private String id;
    private String phone;
    private String gender;
    private String email;
    private String typeCode;
    private String personImage;

    // 능력치 관계 수정: OneToMany로 변경 (하나의 Person이 여러 개의 Ability를 가질 수 있음)
    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    @ToString.Exclude
    private List<Ability> abilities;

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<Injury> injuries;

}
