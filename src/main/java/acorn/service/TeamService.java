package acorn.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import acorn.entity.Team;
import acorn.repository.TeamRepository;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    // 모든 팀 조회
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    // 팀 조회
    public Team getTeamById(String teamIdx) {
        return teamRepository.findById(teamIdx).orElse(null);
    }

    // 새로운 팀 추가
    public Team addTeam(Team team) {
        return teamRepository.save(team);
    }

    // 팀 업데이트
    public Team updateTeam(String teamIdx, Team teamDetails) {
        Team team = getTeamById(teamIdx);
        if (team != null) {
            team.setFacilityIdx(teamDetails.getFacilityIdx());
            team.setTeamName(teamDetails.getTeamName());
            team.setFound(teamDetails.getFound());
            team.setHometown(teamDetails.getHometown());
            team.setTeamImage(teamDetails.getTeamImage());  // 이미지 경로 업데이트
            return teamRepository.save(team);
        }
        return null;
    }

    // 팀 삭제
    public void deleteTeam(String teamIdx) {
        teamRepository.deleteById(teamIdx);
    }
}
