package acorn.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import acorn.entity.Injury;
import acorn.entity.Person;
import acorn.repository.InjuryRepository;

@Service
public class InjuryService {

	private final InjuryRepository injuryRepository;
	
    public InjuryService(InjuryRepository injuryRepository) {
        this.injuryRepository = injuryRepository;
    }
    
 // 부상 부위별 저번달 vs 이번달 부상자 수 비교
    public Map<String, Map<String, Integer>> compareInjuriesByMonth() {
        // 이번 달과 저번 달 날짜 계산
        LocalDate now = LocalDate.now();
        LocalDate startOfThisMonth = now.withDayOfMonth(1);
        LocalDate startOfLastMonth = now.minusMonths(1).withDayOfMonth(1);
        LocalDate endOfLastMonth = now.withDayOfMonth(1).minusDays(1);

        // Date 형식으로 변환
        Date startOfThisMonthDate = Date.from(startOfThisMonth.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date startOfLastMonthDate = Date.from(startOfLastMonth.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date endOfLastMonthDate = Date.from(endOfLastMonth.atStartOfDay(ZoneId.systemDefault()).toInstant());

        // 저번달 부상 데이터 조회
        List<Injury> lastMonthInjuries = injuryRepository.findByBrokenDateBetween(startOfLastMonthDate, endOfLastMonthDate);

        // 이번달 부상 데이터 조회
        List<Injury> thisMonthInjuries = injuryRepository.findByBrokenDateBetween(startOfThisMonthDate, new Date());

        // 부상 부위별로 데이터를 비교하기 위해 맵 생성
        Map<String, Map<String, Integer>> injuryComparison = new HashMap<>();

        // 저번 달 부상 데이터 처리
        Map<String, Long> lastMonthInjuryCount = lastMonthInjuries.stream()
                .collect(Collectors.groupingBy(Injury::getInjuryPart, Collectors.counting()));

        // 이번 달 부상 데이터 처리
        Map<String, Long> thisMonthInjuryCount = thisMonthInjuries.stream()
                .collect(Collectors.groupingBy(Injury::getInjuryPart, Collectors.counting()));

        // 모든 부상 부위에 대해 저번달과 이번달 데이터를 비교
        Set<String> allInjuryParts = new HashSet<>();
        allInjuryParts.addAll(lastMonthInjuryCount.keySet());
        allInjuryParts.addAll(thisMonthInjuryCount.keySet());

        for (String part : allInjuryParts) {
            int lastMonthCount = lastMonthInjuryCount.getOrDefault(part, 0L).intValue();
            int thisMonthCount = thisMonthInjuryCount.getOrDefault(part, 0L).intValue();

            // 부상 부위별로 저번달과 이번달 데이터를 저장
            Map<String, Integer> counts = new HashMap<>();
            counts.put("저번달", lastMonthCount);
            counts.put("이번달", thisMonthCount);

            injuryComparison.put(part, counts);
        }

        return injuryComparison;
    }

	// 월별 부상 발생 빈도 반환
	public List<Map<String, Object>> getInjuriesCountByMonth() {
		List<Object[]> results = injuryRepository.countInjuriesByMonth();
		List<Map<String, Object>> injuryCounts = new ArrayList<>();

		for (Object[] result : results) {
			Map<String, Object> map = new HashMap<>();
			map.put("month", result[0]);
			map.put("count", result[1]);
			injuryCounts.add(map);
		}

		return injuryCounts;
	}

	// 모든 부상 조회 (선수 정보 포함)
	public List<Injury> findAllInjuriesWithPerson() {
		return injuryRepository.findAllInjuriesWithPerson();
	}

	// 모든 부상 조회 (페이징 처리)
	public Page<Injury> getAllInjuries(Pageable pageable) {
		return injuryRepository.findAll(pageable);
	}

	public List<Injury> getAllInjuries() {
		return injuryRepository.findAll();
	}

	// 특정 부상 조회
	public Injury getInjuryById(int injuryIdx) {
		Optional<Injury> injury = injuryRepository.findById(injuryIdx);
		return injury.orElse(null);
	}

	// 새로운 부상 추가
	public Injury addInjury(Injury injury) {
		return injuryRepository.save(injury);
	}

	// 부상 업데이트
	public Injury updateInjury(int injuryIdx, Injury injuryDetails) {
		Injury injury = getInjuryById(injuryIdx);
		if (injury != null) {
			injury.setBrokenDate(injuryDetails.getBrokenDate());
			injury.setSeverity(injuryDetails.getSeverity());
			injury.setDoctor(injuryDetails.getDoctor());
			injury.setRecovery(injuryDetails.getRecovery());
			injury.setInjuryPart(injuryDetails.getInjuryPart()); // 부상 부위 업데이트
			injury.setMemo(injuryDetails.getMemo());
			return injuryRepository.save(injury);
		}
		return null;
	}

	// 부상 삭제
	/*
    @Transactional
    public void deleteInjury(int injuryIdx) {
        injuryRepository.deleteById(injuryIdx);
    }
    */
	
	@Transactional
    public void deleteInjury(int injuryIdx) {
        System.out.println("Attempting to delete injury with ID: " + injuryIdx);
        Injury injury = injuryRepository.findById(injuryIdx).orElse(null);
        if (injury != null) {
            Person person = injury.getPerson();
            if (person != null) {
                person.getInjuries().remove(injury); // Person의 injuries 컬렉션에서 제거
            }
            injuryRepository.delete(injury);
            System.out.println("Injury with ID: " + injuryIdx + " deleted.");
        } else {
            System.out.println("Injury with ID: " + injuryIdx + " not found.");
        }
    }
}