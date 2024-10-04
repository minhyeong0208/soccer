package acorn.dto;

import com.fasterxml.jackson.annotation.JsonAutoDetect;

@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)    // private 필드에 접근 가능
public class RankDto {

    private String title;
    private String rank;

    private String matchCount, victoryPoint, victory, draw, defeat, goals, loss;

    public RankDto(String title, String rank, String matchCount, String victoryPoint, String victory, String draw, String defeat, String goals, String loss){
        this.title = title;
        this.rank = rank;
        this.matchCount = matchCount;
        this.victoryPoint = victoryPoint;
        this.victory = victory;
        this.draw = draw;
        this.defeat = defeat;
        this.goals = goals;
        this.loss = loss;
    }
}
