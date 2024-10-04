package acorn.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import acorn.entity.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, String> {
    // 기본적인 CRUD 메서드들은 JpaRepository가 제공
}
