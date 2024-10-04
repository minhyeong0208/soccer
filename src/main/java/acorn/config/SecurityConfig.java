package acorn.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import acorn.entity.Login;
import acorn.repository.LoginRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private LoginRepository loginRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/css/**", "/persons/verify-password").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN") // 관리자만 접근 가능
                .requestMatchers("/user/**").hasRole("USER") // 사용자만 접근 가능
                .anyRequest().authenticated() // 모든 요청에 대해 인증을 요구
            )
            .formLogin(form -> form
                .loginPage("/login") // 커스텀 로그인 페이지 설정
                .successHandler(customAuthenticationSuccessHandler()) // 커스텀 성공 핸들러 사용
                .permitAll() // 로그인 페이지는 누구나 접근 가능
            )
            .logout(logout -> logout
                .permitAll() // 로그아웃은 누구나 접근 가능
            )
            .sessionManagement(session -> session
                .maximumSessions(10) // 최대 허용 세션 개수
                .expiredUrl("/login?session=expired")
            );
        return http.build();
    }

    // PasswordEncoder 빈 등록
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // BCrypt 알고리즘을 사용하는 PasswordEncoder
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            Login login = loginRepository.findByLoginId(username);
            if (login == null) {
                throw new UsernameNotFoundException("User not found");
            }
            
            System.out.println("로그인한 사용자: " + username);
            System.out.println("DB에서 가져온 비밀번호: " + login.getPw());
            
            // 암호화된 비밀번호를 사용할 수 있도록 설정
            UserBuilder builder = User.withUsername(username)
                .password(login.getPw()) // 암호화된 비밀번호 그대로 사용
                .roles(login.getRole());

            return builder.build();
        };
    }

    @Bean
    public AuthenticationSuccessHandler customAuthenticationSuccessHandler() {
        return new AuthSuccessHandler();
    }

}