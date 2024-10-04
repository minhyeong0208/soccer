package acorn.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import acorn.entity.Team;
import acorn.service.TeamService;

@RestController
@RequestMapping("/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    // 모든 팀 조회
    @GetMapping
    public List<Team> getAllTeams() {
        return teamService.getAllTeams();
    }

    // 특정 팀 조회
    @GetMapping("/{id}")
    public ResponseEntity<Team> getTeamById(@PathVariable("id") String teamIdx) {
        Team team = teamService.getTeamById(teamIdx);
        if (team == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(team);
    }

    // 새로운 팀 추가 (이미지 포함)
    @PostMapping("/add-team-with-image")
    public ResponseEntity<Team> createTeamWithImage(
            @RequestPart("team") Team team,
            @RequestPart("file") MultipartFile file) throws IOException {

        // 이미지 파일 저장 경로 설정
        String fileName = file.getOriginalFilename();
        String uploadDir = "C:/Project/SoccerERP/src/main/resources/static/img/team/";
        Path filePath = Paths.get(uploadDir + fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // DB에 저장할 경로 설정
        team.setTeamImage(fileName);

        // 새로운 팀 추가
        Team savedTeam = teamService.addTeam(team);
        return ResponseEntity.ok(savedTeam);
    }

    // 팀 업데이트 (이미지 포함)
    @PutMapping("/{id}/with-image")
    public ResponseEntity<Team> updateTeamWithImage(
            @PathVariable("id") String teamIdx,
            @RequestPart("team") Team teamDetails,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

        Team existingTeam = teamService.getTeamById(teamIdx);
        if (existingTeam == null) {
            return ResponseEntity.notFound().build();
        }

        // 파일이 있는 경우에만 이미지 업데이트
        if (file != null && !file.isEmpty()) {
            String fileName = file.getOriginalFilename();
            String uploadDir = "C:/Project/SoccerERP/src/main/resources/static/img/team/";
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            teamDetails.setTeamImage(fileName);  // 새로운 이미지 경로 설정
        } else {
            // 이미지가 없을 경우 기존 이미지를 유지
            teamDetails.setTeamImage(existingTeam.getTeamImage());
        }

        // 기타 정보 업데이트
        Team updatedTeam = teamService.updateTeam(teamIdx, teamDetails);
        return ResponseEntity.ok(updatedTeam);
    }

    // 팀 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTeam(@PathVariable("id") String teamIdx) {
        teamService.deleteTeam(teamIdx);
        return ResponseEntity.ok("Team with ID " + teamIdx + " has been successfully deleted.");
    }
}
