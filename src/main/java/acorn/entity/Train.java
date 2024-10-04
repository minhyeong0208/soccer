package acorn.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Train {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int trainIdx;

    private String trainName;
    private Date startDate;
    private Date endDate;
    private Date startTime;
    private Date endTime;
    private String area;
    private String memo;
    private String countMem;

    @OneToMany(mappedBy = "train", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<TrainMem> trainMems;
}
