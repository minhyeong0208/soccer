package acorn.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import acorn.entity.Login;
import acorn.repository.LoginRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import acorn.entity.Person;
import acorn.service.PersonService;

@RestController
@RequestMapping("/persons")
public class PersonController {

	@Autowired
	private PersonService personService;

	@Autowired
    private PasswordEncoder passwordEncoder;

	@Autowired
	private LoginRepository loginRepository;

	// 포지션별 선수 수 조회
	@GetMapping("/positions/count")
	public ResponseEntity<List<Map<String, Object>>> getPlayersCountByPosition() {
		List<Map<String, Object>> positionCounts = personService.getPlayersCountByPosition();
		return ResponseEntity.ok(positionCounts);
	}

	// 모든 사람 조회 (페이징 처리)
	@GetMapping
	public Page<Person> getAllPersons(Pageable pageable) {
		return personService.getAllPersons(pageable);
	}

	// 모든 선수 조회 (능력치 포함)
	@GetMapping("/with-ability")
	public List<Person> getAllPersonsWithAbility() {
		return personService.getAllPersonsWithAbility();
	}

	// 선수만 조회 (이적 시 판매용, 페이징 처리)
	@GetMapping("/players")
	public Page<Person> getAllPlayers(Pageable pageable) {
		return personService.getPersonsByTypeCode("player", pageable);
	}

	// 코치만 조회 (페이징 처리)
	@GetMapping("/coaches")
	public Page<Person> getAllCoaches(Pageable pageable) {
		return personService.getPersonsByTypeCode("coach", pageable);
	}

	// 검색 기능: 이름 또는 포지션으로 검색 (페이징 처리)
	@GetMapping("/search")
	public Page<Person> searchPersons(@RequestParam(value = "personName", required = false) String personName,
									  @RequestParam(value = "position", required = false) String position, Pageable pageable) {
		return personService.searchPersons(personName, position, pageable);
	}

	// 특정 사람 조회
	@GetMapping("/{id}")
	public ResponseEntity<Person> getPersonById(@PathVariable(value = "id") int personIdx) {
		Person person = personService.getPersonById(personIdx);
		if (person == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok().body(person);
	}
	
	// 특정 사람 조회 (id 칼럼 기준)
	@GetMapping("/coaches/{login-id}")
	public ResponseEntity<Person> getPersonByLoginId(@PathVariable(value = "login-id") String loginId) {
	    Person person = personService.getPersonByLoginId(loginId);
	    if (person == null) {
	        return ResponseEntity.notFound().build();
	    }
	    return ResponseEntity.ok().body(person);
	}
	

	// 새로운 사람 추가
	@PostMapping
	public Person createPerson(@RequestBody Person person) {
		return personService.addPerson(person);
	}

	@GetMapping("/image")
	public ResponseEntity<?> getPersonImage(@RequestParam int backNumber, @RequestParam String personName) {
		return ResponseEntity.ok(personService.getPersonImagePath(backNumber, personName));
	}

	@PostMapping("/add-only-image")
	public ResponseEntity<?> uploadImage(@RequestPart("file") MultipartFile file) throws IOException {
		// 이미지 파일 저장 경로 설정
		// TODO : Properties 경로 사용
		String uploadDir = "src/main/resources/static/img/persons/";

		try {
		// 디렉토리가 존재하지 않으면 생성
			Path uploadPath = Paths.get(uploadDir);
			if (!Files.exists(uploadPath)) {
				Files.createDirectories(uploadPath);
			}

			// 파일명에서 공백 제거 및 현재 시간 추가하여 유니크한 파일명 생성
			String originalFilename = file.getOriginalFilename();
			String filename = originalFilename.replaceAll("\\s+", "_");
			String uniqueFilename = System.currentTimeMillis() + "_" + filename;

			Path filePath = uploadPath.resolve(uniqueFilename);
			Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

			// 저장된 파일 경로 반환
			Map<String, String> response = new HashMap<>();
			response.put("imageLocation", uniqueFilename);

			return ResponseEntity.ok(response);
		} catch (IOException e) {
			return ResponseEntity.internalServerError().body("파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// JSON + 이미지 파일 업로드를 받는 새로운 방식
	@PostMapping("/add-player-with-image")
	public ResponseEntity<Person> createPersonWithImage(
			@RequestPart("person") Person person,
			@RequestPart("file") MultipartFile file) throws IOException {

		// 이미지 파일 저장 경로 설정
		String fileName = file.getOriginalFilename();

		String uploadDir = "C:/Project/SoccerERP/src/main/resources/static/img/persons/";
		
		Path filePath = Paths.get(uploadDir + fileName);
		Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

		// DB에 저장할 경로 설정
		person.setPersonImage(fileName);
		System.out.println("Received file: " + file.getOriginalFilename());
		System.out.println("Received person data: " + person);
		// 새로운 사람 추가
		Person savedPerson = personService.addPerson(person);
		return ResponseEntity.ok(savedPerson);
	}

	// 사람 업데이트
	@PutMapping("/{id}")
	public ResponseEntity<Person> updatePerson(@PathVariable(value = "id") int personIdx,
											   @RequestBody Person personDetails) {
		Person updatedPerson = personService.updatePerson(personIdx, personDetails);
		if (updatedPerson == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(updatedPerson);
	}

	@PutMapping("/{id}/with-image")
	public ResponseEntity<Person> updatePersonWithImage(
			@PathVariable(value = "id") int personIdx,
			@RequestPart("person") Person personDetails,
			@RequestPart(value = "file", required = false) MultipartFile file) throws IOException {

		Person existingPerson = personService.getPersonById(personIdx);
		if (existingPerson == null) {
			return ResponseEntity.notFound().build();
		}

		// 파일이 있는 경우에만 이미지 업데이트
		if (file != null && !file.isEmpty()) {
			String fileName = file.getOriginalFilename();
			String uploadDir = "C:/Project/SoccerERP/src/main/resources/static/img/persons/";
			Path filePath = Paths.get(uploadDir + fileName);
			Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
			personDetails.setPersonImage(fileName); // 새로운 이미지 경로 설정
		} else {
			// 이미지가 없을 경우 기존 이미지를 유지
			personDetails.setPersonImage(existingPerson.getPersonImage());
		}

		// 기타 정보 업데이트
		Person updatedPerson = personService.updatePerson(personIdx, personDetails);
		return ResponseEntity.ok(updatedPerson);
	}


	// 사람 삭제
	@DeleteMapping("/{id}")
	public ResponseEntity<String> deletePerson(@PathVariable(value = "id") int personIdx) {
		personService.deletePerson(personIdx);
		return ResponseEntity.ok("Person with ID " + personIdx + " has been successfully deleted.");
	}

	// 다중 삭제 엔드포인트
	@DeleteMapping("/delete-multiple")
	public ResponseEntity<String> deletePersons(@RequestBody List<Integer> personIds) {
		personService.deletePersons(personIds);
		return ResponseEntity.ok("Persons with IDs " + personIds + " have been successfully deleted.");
	}

	@PostMapping("/verify-password")
	public ResponseEntity<?> verifyPassword(@RequestBody Map<String, String> request, Authentication authentication) {
	    String currentPassword = request.get("password");
	    String loginId = authentication.getName(); // 인증된 사용자의 로그인 ID를 가져옴

	    // 로그인 ID로 DB에서 비밀번호 조회
	    Login login = loginRepository.findByLoginId(loginId);

	    if (login == null || login.getPw() == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("사용자를 찾을 수 없거나 비밀번호가 없습니다.");
	    }

	    // 로그 추가: 입력된 비밀번호와 DB에서 가져온 암호화된 비밀번호 확인
	    System.out.println("입력된 비밀번호: " + currentPassword);
	    System.out.println("DB에서 가져온 비밀번호: " + login.getPw());

	    // 비밀번호가 일치하는지 확인
	    if (passwordEncoder.matches(currentPassword, login.getPw())) {
	        return ResponseEntity.ok(Collections.singletonMap("verified", true));
	    } else {
	        return ResponseEntity.ok(Collections.singletonMap("verified", false));
	    }
	}

	@PutMapping("/{personIdx}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable("personIdx") int personIdx, @RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");

        if (newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body("새 비밀번호를 입력해주세요.");
        }

        // 서비스에서 비밀번호 변경 처리
        personService.changePassword(personIdx, newPassword);

        return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
    }


}
