package acorn.controller;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import acorn.entity.Finance;
import acorn.service.FinanceService;

@RestController
@RequestMapping("/finances")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping
    public Page<Finance> getFinances(@RequestParam(name = "type", required = false) String type,
                                     @RequestParam(name = "startDate", required = false) String startDateStr,
                                     @RequestParam(name = "endDate", required = false) String endDateStr,
                                     @RequestParam(name = "keyword", required = false) String keyword,
                                     @RequestParam(name = "page", defaultValue = "0") int page,
                                     @RequestParam(name = "size", defaultValue = "10") int size) {

        // 날짜 형식 지정 (날짜까지만 입력할 때 기본 시간 설정)
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

        Timestamp startDate = null;
        Timestamp endDate = null;

        try {
            if (startDateStr != null) {
                Date parsedStartDate = dateFormat.parse(startDateStr);
                // startDate는 00:00:00으로 설정
                startDate = new Timestamp(parsedStartDate.getTime());
            }
            if (endDateStr != null) {
                Date parsedEndDate = dateFormat.parse(endDateStr);
                // endDate를 23:59:59.999로 설정
                endDate = new Timestamp(parsedEndDate.getTime() + (24 * 60 * 60 * 1000 - 1));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("financeDate").descending());

        return financeService.getFinancesByTypeAndDateAndKeyword(type, startDate, endDate, keyword, pageable);
    }

    // 수입 항목 추가
    @PostMapping("/income")
    public Finance addIncome(@RequestBody Finance finance) {
        return financeService.addIncome(finance);
    }

    // 지출 항목 추가
    @PostMapping("/expense")
    public Finance addExpense(@RequestBody Finance finance) {
        return financeService.addExpense(finance);
    }

    @PutMapping("/{id}")
    public Finance updateFinance(@PathVariable("id") int id, @RequestBody Finance financeDetails) {
        return financeService.updateFinance(id, financeDetails);
    }

    // 특정 수입/지출 데이터 삭제
    @DeleteMapping
    public void deleteFinances(@RequestBody List<Integer> ids) {
        financeService.deleteFinance(ids);
    }
}
