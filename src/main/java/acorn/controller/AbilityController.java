package acorn.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import acorn.entity.Ability;
import acorn.service.AbilityService;

@RestController
@RequestMapping("/abilities")
public class AbilityController {

	@Autowired
    private AbilityService abilityService;

    
    // 모든 능력치 조회
    @GetMapping
    public List<Ability> getAllAbilities() {
        return abilityService.getAllAbilities();
    }

    // 특정 능력치 조회
    @GetMapping("/{id}")
    public ResponseEntity<Ability> getAbilityById(@PathVariable(value = "id") int abilityIdx) {
        Ability ability = abilityService.getAbilityById(abilityIdx);
        if (ability == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().body(ability);
    }

    // 특정 선수의 예측 및 실제 능력치 조회
    @GetMapping("/person/{personIdx}/abilities")
    public ResponseEntity<Map<String, Ability>> getAbilities(@PathVariable int personIdx) {
        Map<String, Ability> abilities = abilityService.getActualAndPrediction(personIdx);
        return ResponseEntity.ok().body(abilities);
    }

    // 새로운 실제 능력치 추가 (기존 데이터 업데이트가 아니라 새로운 데이터로 추가)
    @PostMapping("/actual/{personIdx}") 
    public Ability createActualAbility(@RequestBody Ability ability, @PathVariable("personIdx") int personIdx) { 
        return abilityService.addAbility(ability, personIdx); 
    }


    // 능력치 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAbility(@PathVariable(value = "id") int abilityIdx) {
        abilityService.deleteAbility(abilityIdx);
        return ResponseEntity.ok().build();
    }
}
