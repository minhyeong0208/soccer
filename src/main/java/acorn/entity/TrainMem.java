package acorn.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "trainmem")
public class TrainMem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int trainmemIdx;

    @ManyToOne
    @JoinColumn(name = "train_idx")
    @JsonBackReference
    private Train train;

    @ManyToOne
    @JoinColumn(name = "person_idx")
    private Person person;
}
