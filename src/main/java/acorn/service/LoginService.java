package acorn.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import acorn.entity.Login;
import acorn.repository.LoginRepository;

@Service
public class LoginService {

	@Autowired
	private LoginRepository loginRepository;
	
	public Login addUser(Login login) {
	    try {
	        return loginRepository.save(login);
	    } catch (Exception e) {
	        e.printStackTrace();  // 예외 발생 시 스택 트레이스를 출력
	        return null;
	    }
	}
}
