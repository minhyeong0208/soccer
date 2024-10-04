package acorn.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordEncoderUtil {
	public static void main(String[] args) {
		BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
		String rawPassword = "123"; // 생성할 비밀번호를 문자열로 입력
		String encodedPassword = encoder.encode(rawPassword); // 암호화된 비밀번호 설정

		
		System.out.println("Encoded password : " + encodedPassword); // Java Application 실행
		
		// update login set pw = 비밀번호 where login_id = 아이디
	}

}

 