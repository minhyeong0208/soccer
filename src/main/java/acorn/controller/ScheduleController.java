package acorn.controller;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import acorn.entity.Game;
import acorn.entity.Injury;
import acorn.entity.Train;
import acorn.service.GameService;
import acorn.service.InjuryService;
import acorn.service.TrainService;

@RestController
@RequestMapping("/schedule")
public class ScheduleController {

    private final InjuryService injuryService;
    private final TrainService trainService;
    private final GameService gameService;

    public ScheduleController(InjuryService injuryService, TrainService trainService, GameService gameService) {
        this.injuryService = injuryService;
        this.trainService = trainService;
        this.gameService = gameService;
    }

    // 일정 조회 (부상, 훈련 및 경기 리스트)
    @GetMapping("/list")
    public Map<String, List<?>> getScheduleList() {
        List<Injury> injuries = injuryService.getAllInjuries();
        List<Train> trainings = trainService.getAllTrains();
        List<Game> games = gameService.getAllGames();

        Map<String, List<?>> scheduleMap = new HashMap<>();
        scheduleMap.put("injuries", injuries);
        scheduleMap.put("trainings", trainings);
        scheduleMap.put("games", games);

        return scheduleMap;
    }
    
    // 오늘 일정 조회 (부상, 훈련 및 경기 리스트)
    @GetMapping("/today")
    public Map<String, List<?>> getTodayScheduleList() {
        LocalDate today = LocalDate.now();  // 오늘 날짜

        // 오늘의 부상, 훈련, 경기만 필터링
        List<Injury> todayInjuries = injuryService.getAllInjuries().stream()
                .filter(injury -> isToday(injury.getBrokenDate()))
                .collect(Collectors.toList());

        List<Train> todayTrainings = trainService.getAllTrains().stream()
                .filter(train -> isToday(train.getStartDate()))
                .collect(Collectors.toList());

        List<Game> todayGames = gameService.getAllGames().stream()
                .filter(game -> game.getGameDate().equals(today))  // gameDate와 오늘 날짜 비교
                .collect(Collectors.toList());

        Map<String, List<?>> todayScheduleMap = new HashMap<>();
        todayScheduleMap.put("injuries", todayInjuries);
        todayScheduleMap.put("trainings", todayTrainings);
        todayScheduleMap.put("games", todayGames);

        return todayScheduleMap;
    }

    // Date 객체를 LocalDate로 변환하여 오늘 날짜와 비교하는 메서드
    private boolean isToday(Date date) {
        LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        return localDate.equals(LocalDate.now());
    }
}
