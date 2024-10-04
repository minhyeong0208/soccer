package acorn.controller;

import java.util.Arrays;
import java.util.List;

import acorn.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {
	
	@Autowired
    private GameService gameService;

    private final static String gameTypeStr = "전체,리그,토너먼트";
    private final static String transferTypeStr = "전체,구매,판매";

    @GetMapping("/login")
    public String login() { return "layout/login"; } // 로그인 페이지 (login.html)
    
    // 관리자 : 재정 관리
    @GetMapping("/admin/finance")
    public String adminFinance() { return "layout/finance"; }
    
    // 관리자 : 스폰서 관리
    @GetMapping("/admin/sponsor")
    public String adminSponsor() { return "layout/sponsor"; }
    
    // 공통 : 대시보드
    @GetMapping("/dashboard")
    public String dashboard() { return "layout/dashboard"; }
    
    // 사용자 : 경기 관리
    @GetMapping("/user/game")
    public String gameList(Model model) {
        /* 경기 수 */
        model.addAttribute("matchCount", gameService.getTotalGames());
        /* 승패 마진 */
        model.addAttribute("winLossMargin", gameService.getWinLossMargin());
        /* 팀 득점 */
        model.addAttribute("teamScore", gameService.getTotalGoals());
        /* 팀 실점 (새로 추가) */
        model.addAttribute("teamConcede", gameService.getTotalConcede());

        /* 게임 구분 */
        List<String> gameType = Arrays.asList(gameTypeStr.split(","));
        model.addAttribute("gameType", gameType);
        /* 최근 1경기 */
        model.addAttribute("mostRecentGame", gameService.getMostRecentGame());

        // 해당 뷰로 이동
        return "layout/games";
    }

    // 공통 : 일정 관리
    @GetMapping("/schedule")
    public String schedule(){ return "layout/schedule"; }
    
    // 사용자 : 부상 관리
    @GetMapping("/user/injury")
    public String injury() { return "layout/injury"; }
    
    // 관리자, 사용자 : 시설 관리
    @GetMapping("/admin/facility")
    public String adminFacility() { return "layout/facility"; }
    @GetMapping("/user/facility")
    public String userFacility() { return "layout/facility"; }
    
    // 사용자 : 훈련 관리
    @GetMapping("/user/train")
    public String train(){ return "layout/train"; }

    // 관리자, 사용자 : 선수 관리
    @GetMapping("/admin/player")
    public String adminPlayer(){ return "layout/player"; }
    @GetMapping("/user/player")
    public String userPlayer(){ return "layout/player"; }

    // 관리자, 사용자 : 코치 관리
    @GetMapping("/admin/coach")
    public String adminCoach(){ return "layout/coach"; }
    @GetMapping("/user/coach")
    public String userCoach(){ return "layout/coach"; }
    
    // 관리자, 사용자 : 팀 정보
    @GetMapping("/admin/team")
    public String adminTeam(){ return "layout/team"; }
    @GetMapping("/user/team")
    public String userTeam(){ return "layout/team"; }

    // 관리자, 사용자 : 이적 관리
    @GetMapping("/admin/transfer")
    public String adminTransfer(Model model){
        /* 이적 구분 */
        List<String> transferType = Arrays.asList(transferTypeStr.split(","));
        model.addAttribute("transferType", transferType);
        return "layout/transfer";
    }
    @GetMapping("/user/transfer")
    public String userTransfer(Model model){
        /* 이적 구분 */
        List<String> transferType = Arrays.asList(transferTypeStr.split(","));
        model.addAttribute("transferType", transferType);
        return "layout/transfer";
    }
    
    @GetMapping("/user/personal")
    public String userPersonal() { return "layout/personal"; }
    
}