package acorn.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import acorn.entity.Login;

@Repository
public interface LoginRepository extends JpaRepository<Login, Integer>{
	Login findByLoginId(String loginId);
	
	// id로 로그인 정보 삭제
    void deleteByLoginId(String loginId);
}
