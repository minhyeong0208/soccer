package acorn.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import acorn.entity.Ability;
import acorn.entity.Person;
import acorn.repository.AbilityRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AbilityService {

    private final AbilityRepository abilityRepository;

    @Autowired
    public AbilityService(AbilityRepository abilityRepository) {
        this.abilityRepository = abilityRepository;
    }

    // 모든 능력치 조회
    public List<Ability> getAllAbilities() {
        return abilityRepository.findAll();
    }

    // 특정 능력치 조회
    public Ability getAbilityById(int abilityIdx) {
        Optional<Ability> ability = abilityRepository.findById(abilityIdx);
        return ability.orElse(null);
    }

    // 특정 선수의 예측 능력치 (2024-10-06 고정) 조회
    public Ability getFixedPredictionForPerson(int personIdx) {
    	LocalDateTime fixedDate = LocalDateTime.of(2024, 10, 6, 12, 5, 8);
        return abilityRepository.findFixedPredictionByPersonIdx(personIdx, fixedDate);
    }
    
    // 새로운 능력치 추가
    public Ability addAbility(Ability ability, int personIdx) {
    	// Person 객체를 생성하여 설정
        Person person = new Person();
        person.setPersonIdx(personIdx);
        
        
       // Ability 객체에 Person 설정
        ability.setPerson(person);

        // 디버그용 로그 추가
        //System.out.println("Person ID: " + ability.getPerson().getPersonIdx());
    	ability.setInputType(0);  // 실제 값으로 추가
        ability.setMeasureDate(LocalDateTime.now());  // 측정일을 현재로 설정
        return abilityRepository.save(ability);
    }
    
    // 예측 능력치와 실제 능력치를 모두 조회하는 메서드
    public Map<String, Ability> getActualAndPrediction(int personIdx) {
        Ability actual = getLatestActualAbilityByPersonIdx(personIdx);
        Ability prediction = getFixedPredictionForPerson(personIdx);

        Map<String, Ability> abilities = new HashMap<>();
        abilities.put("actual", actual);
        abilities.put("prediction", prediction);

        return abilities;
    }

    // 특정 선수의 최신 실제 능력치 조회
    public Ability getLatestActualAbilityByPersonIdx(int personIdx) {
    	List<Ability> actualAbilities = abilityRepository.findActualAbilitiesByPersonIdx(personIdx);
        return actualAbilities.isEmpty() ? null : actualAbilities.get(0);  // 첫 번째 데이터를 반환
    }

    // 능력치 삭제
    public void deleteAbility(int abilityIdx) {
        abilityRepository.deleteById(abilityIdx);
    }
}
