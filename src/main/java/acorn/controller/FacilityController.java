package acorn.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import acorn.entity.Facility;
import acorn.service.FacilityService;

@RestController
@RequestMapping("/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }
    
    // 모든 시설 조회 (페이징 없이)
    @GetMapping("/all")
    public List<Facility> getAllFacilities() {
        return facilityService.getAllFacilities();
    }
    
    // 페이징 처리 추가 - 09-09
    // 페이징 처리된 모든 시설 조회
    @GetMapping
    public Page<Facility> getAllFacilities(Pageable pageable) {
        return facilityService.getAllFacilities(pageable);
    }
    
    // (value = "facilityName") 추가 - 09-09
    // 시설명으로 검색
    @GetMapping("/search")
    public Page<Facility> searchFacilitiesByName(@RequestParam(value = "facilityName") String facilityName, Pageable pageable) {
        return facilityService.searchFacilitiesByName(facilityName, pageable);
    }

    // 특정 시설 조회 추가 - 09-14
    @GetMapping("/{id}")
    public ResponseEntity<Facility> getFacilityById(@PathVariable(value = "id") int facilityIdx) {
        Facility facility = facilityService.getFacilityById(facilityIdx);
        if (facility != null) {
            return ResponseEntity.ok(facility);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // 새로운 시설 추가
    @PostMapping
    public Facility createFacility(@RequestBody Facility facility) {
        return facilityService.addFacility(facility);
    }

    // 시설 업데이트
    @PutMapping("/{id}")
    public ResponseEntity<Facility> updateFacility(
            @PathVariable(value = "id") int facilityIdx, @RequestBody Facility facilityDetails) {
        Facility updatedFacility = facilityService.updateFacility(facilityIdx, facilityDetails);
        if (updatedFacility == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedFacility);
    }

    // 시설 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFacility(@PathVariable(value = "id") int facilityIdx) {
        facilityService.deleteFacility(facilityIdx);
        return ResponseEntity.ok("Facility with ID " + facilityIdx + " has been successfully deleted.");
    }


    // 선택된 시설 삭제
    @DeleteMapping("/delete-multiple")
    public ResponseEntity<String> deleteFacilities(@RequestBody List<Integer> facilityIds) {
        facilityService.deleteFacilities(facilityIds);
        return ResponseEntity.ok("Facilities with IDs " + facilityIds + " have been successfully deleted.");
    }

}
