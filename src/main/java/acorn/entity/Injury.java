package acorn.entity;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Injury {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "injury_idx")
    private int injuryIdx;

    @ManyToOne
    @JoinColumn(name = "person_idx")
    @JsonBackReference
    private Person person;

    private Date brokenDate;
    private String severity;
    private String doctor;
    private int recovery;
    private String injuryPart;
    private String memo;
}
