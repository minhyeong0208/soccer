package acorn.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import acorn.entity.Facility;
import acorn.repository.FacilityRepository;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }
   
    // 모든 시설 조회 (페이징 없이)
    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }
    
    // 페이징 처리 추가 - 09-09
    // 페이징 처리된 모든 시설 조회 
    public Page<Facility> getAllFacilities(Pageable pageable) {
        return facilityRepository.findAll(pageable);
    }
    
    // 시설명으로 검색
    public Page<Facility> searchFacilitiesByName(String facilityName, Pageable pageable) {
        return facilityRepository.findByFacilityNameContaining(facilityName, pageable);
    }
    // 새로운 시설 추가
    public Facility addFacility(Facility facility) {
        return facilityRepository.save(facility);
    }

    // 시설 업데이트
    public Facility updateFacility(int facilityIdx, Facility facilityDetails) {
        Facility facility = getFacilityById(facilityIdx);
        if (facility != null) {
            facility.setFacilityName(facilityDetails.getFacilityName());
            facility.setFacilityLocation(facilityDetails.getFacilityLocation());
            facility.setLatitude(facilityDetails.getLatitude());
            facility.setLongitude(facilityDetails.getLongitude());
            facility.setCapacity(facilityDetails.getCapacity());
            facility.setFacilityFound(facilityDetails.getFacilityFound());
            return facilityRepository.save(facility);
        }
        return null;
    }

    // 특정 시설 조회
    public Facility getFacilityById(int facilityIdx) {
        Optional<Facility> facility = facilityRepository.findById(facilityIdx);
        return facility.orElse(null);
    }

    // 시설 삭제
    public void deleteFacility(int facilityIdx) {
        facilityRepository.deleteById(facilityIdx);
    }

    // 선택된 시설들 삭제
    public void deleteFacilities(List<Integer> facilityIds) {
        facilityRepository.deleteAllByIdInBatch(facilityIds);
    }
}
