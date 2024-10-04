package acorn.controller;

import acorn.dto.RankDto;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class RankController {

    @GetMapping("/rank")
    public List<RankDto> rank() {
        List<RankDto> list = new ArrayList<>();
        try {

            Document doc = Jsoup.connect("https://sports.news.naver.com/kfootball/record/index")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36")
                    .get();

            Elements footballTeams = doc.select("#regularGroup_table > tr");

            for (Element team : footballTeams) {
                Element rank = team.selectFirst("th");
                Element title = team.selectFirst("span:nth-child(2)");  // 팀명
                Element matchCount = team.selectFirst("td:nth-child(3)");   // 경기 수 
                Element victoryPoint = team.selectFirst("td:nth-child(4)"); // 승점
                Element victory = team.selectFirst("td:nth-child(5)");  // 승수
                Element draw = team.selectFirst("td:nth-child(6)");     // 무승무수
                Element defeat = team.selectFirst("td:nth-child(7)");   // 패수
                Element goals = team.selectFirst("td:nth-child(8)");    // 득점
                Element loss = team.selectFirst("td:nth-child(9)");     // 실점

                if (title != null) {
                    RankDto rankData = new RankDto(title.text(), rank.text(), matchCount.text(), victoryPoint.text(),
                            victory.text(), draw.text(), defeat.text(), goals.text(), loss.text());
                    list.add(rankData);
                }

            }

        } catch (Exception e) {
            e.printStackTrace();
            ;
        }

        return list;

    }
}
