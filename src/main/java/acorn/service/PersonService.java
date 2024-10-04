package acorn.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import acorn.repository.LoginRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import acorn.entity.Login;
import acorn.entity.Person;
import acorn.repository.PersonRepository;

@Service
public class PersonService {

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private LoginService loginService;

    @Autowired
    private PasswordEncoder passwordEncoder; // PasswordEncoder 주입

    @Autowired
    private LoginRepository loginRepository;

    // 포지션별 선수 수 반환
    public List<Map<String, Object>> getPlayersCountByPosition() {
        List<Object[]> results = personRepository.countPlayersByPosition();
        List<Map<String, Object>> positionCounts = new ArrayList<>();
        
        for (Object[] result : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("position", result[0]);
            map.put("count", result[1]);
            positionCounts.add(map);
        }
        
        return positionCounts;
    }
    
    // 여러 ID로 선수 조회
    public List<Person> getPersonsByIds(List<Integer> ids) {
        return personRepository.findAllById(ids);
    }

    // 모든 사람 조회 (페이징 처리)
    public Page<Person> getAllPersons(Pageable pageable) {
        return personRepository.findAllWithAbility(pageable);
    }

    // 모든 사람 조회 (페이징 없이)
    public List<Person> getAllPersons() {
        return personRepository.findAll();
    }

    // 모든 선수 조회 (능력치 포함, 페이징 없이)
    public List<Person> getAllPersonsWithAbility() {
        return personRepository.findAllWithAbility();
    }

    // 역할 구분에 따른 조회 (선수/코치)
    public Page<Person> getPersonsByTypeCode(String typeCode, Pageable pageable) {
        return personRepository.findByTypeCode(typeCode, pageable);
    }

    // 선수명 또는 포지션 검색 (페이징 처리)
    public Page<Person> searchPersons(String personName, String position, Pageable pageable) {
        return personRepository.searchByPersonNameOrPosition(personName, position, pageable); 
    }

    // 특정 사람 조회
    public Person getPersonById(int personIdx) {
        return personRepository.findById(personIdx).orElse(null);
    }

    // TODO : image return
    public String getPersonImagePath(int backNumber, String personName) {
        return personRepository.findPersonImageByPersonIdx(backNumber, personName)
                .orElse("/img/default-person.png");
    }

    public Person addPerson(Person person) {
    	// 양방향 관계 설정
        if (person.getAbilities() != null) {
        	person.getAbilities().forEach(ability -> ability.setPerson(person));
        }

        Person savedPerson = personRepository.save(person);  // person 테이블 저장
        System.out.println("Person saved successfully: " + savedPerson.getPersonIdx());
        // 기본 비밀번호 "123"을 암호화
        String defaultPassword = passwordEncoder.encode("123");

        try {
            Login login = Login.builder()
                .loginId(savedPerson.getId())
                .pw(defaultPassword)
                .role("USER")
                .build();
            
            loginService.addUser(login);  // login 테이블 저장
            System.out.println("Login data added: " + login.getLoginId());
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // transfer나 다른 관련 데이터 삽입 시도 (외래 키 오류 발생 가능)
        
        return savedPerson;
    }
    
    // 사람 업데이트
    public Person updatePerson(int personIdx, Person personDetails) {
        Person person = getPersonById(personIdx); // 기존의 데이터를 가져옴
        if (person != null) {
            // 필드가 null이 아닐 때만 업데이트 (문자열 등)
            if (personDetails.getPersonName() != null) {
                person.setPersonName(personDetails.getPersonName());
            }
            if (personDetails.getTeamIdx() != null) {
                person.setTeamIdx(personDetails.getTeamIdx());
            }
            if (personDetails.getFacilityIdx() != 0) { // 숫자 필드 체크
                person.setFacilityIdx(personDetails.getFacilityIdx());
            }
            if (personDetails.getHeight() != 0) { // 키가 0이 아니면 업데이트
                person.setHeight(personDetails.getHeight());
            }
            if (personDetails.getWeight() != 0) {
                person.setWeight(personDetails.getWeight());
            }
            if (personDetails.getBirth() != null) {
                person.setBirth(personDetails.getBirth());
            }
            if (personDetails.getPosition() != null) {
                person.setPosition(personDetails.getPosition());
            }
            if (personDetails.getBackNumber() != 0) { // 백넘버가 0이 아니면 업데이트
                person.setBackNumber(personDetails.getBackNumber());
            }
            if (personDetails.getNationality() != null) {
                person.setNationality(personDetails.getNationality());
            }
            if (personDetails.getContractStart() != null) {
                person.setContractStart(personDetails.getContractStart());
            }
            if (personDetails.getContractEnd() != null) {
                person.setContractEnd(personDetails.getContractEnd());
            }
            if (personDetails.getId() != null) {
                person.setId(personDetails.getId());
            }
            if (personDetails.getPhone() != null) {
                person.setPhone(personDetails.getPhone());
            }
            if (personDetails.getGender() != null) {
                person.setGender(personDetails.getGender());
            }
            if (personDetails.getEmail() != null) {
                person.setEmail(personDetails.getEmail());
            }
            if (personDetails.getTypeCode() != null) {
                person.setTypeCode(personDetails.getTypeCode());
            }
            if (personDetails.getPersonImage() != null) {
                person.setPersonImage(personDetails.getPersonImage());
            }
            // 능력치 업데이트 (null 체크)
            if (personDetails.getAbilities() != null) {
            	person.setAbilities(personDetails.getAbilities());
                person.getAbilities().forEach(ability -> ability.setPerson(person));
            }

            return personRepository.save(person);
        }
        return null;
    }

    // 유효한 등번호인지 확인
    private boolean validBackNumber(String teamIdx, int backNumber) { return !personRepository.existsByBackNumber(teamIdx, backNumber); }

    // 사람 삭제
    public void deletePerson(int personIdx) {
        personRepository.deleteById(personIdx);
    }
    
    @Transactional
    public void deletePersons(List<Integer> personIds) {
        for (Integer personIdx : personIds) {
            // 각 personIdx로 Person 엔티티를 찾기
            Person person = personRepository.findByPersonIdx(personIdx);
            if (person != null) {
                // login 테이블에서 해당 id로 레코드를 삭제
                loginRepository.deleteByLoginId(person.getId());
                //System.out.println("Deleting login record with loginId: " + person.getId());
            }
        }
        // person 테이블의 레코드 삭제
        personRepository.deleteAllByIdInBatch(personIds);
    }
    
    public Person getPersonByLoginId(String loginId) {
        return personRepository.findById(loginId);
    }

    /**
     * 팀에 소속된 선수 목록 조회
     * @param teamIdx
     * @return
     */
    public List<Person> findAllWithTeamIdx(String teamIdx) { return personRepository.findAllWithTeamIdx(teamIdx); }

 // 비밀번호 변경 로직
    public void changePassword(int personIdx, String newPassword) {
        Person person = personRepository.findByPersonIdx(personIdx);

        if (person == null) {
            throw new RuntimeException("Person not found for personIdx: " + personIdx);
        }

        Login login = loginRepository.findByLoginId(person.getId());
        if (login == null) {
            throw new RuntimeException("Login not found for loginId: " + person.getId());
        }

        // 로그 출력: 비밀번호 변경 확인
        System.out.println("Changing password for person with ID: " + personIdx);

        String encodedPassword = passwordEncoder.encode(newPassword);
        login.setPw(encodedPassword);
        loginRepository.save(login);

        // 로그 출력: 비밀번호 변경 완료
        System.out.println("Password successfully changed for person with ID: " + personIdx);
    }


}
