package com.company.employee_portal.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum TicketType {

    // 休暇・休業
    ANNUAL_LEAVE("年次有給休暇申請", "休暇・休業"),
    SICK_LEAVE("病気休暇申請", "休暇・休業"),
    COMPENSATORY_LEAVE("代休申請", "休暇・休業"),
    SPECIAL_LEAVE("特別休暇申請", "休暇・休業"),
    UNPAID_LEAVE("欠勤申請", "休暇・休業"),

    // 育児・介護・慶弔
    MATERNITY_LEAVE("産前産後休業申請", "育児・介護・慶弔"),
    PATERNITY_LEAVE("育児休業申請（父親）", "育児・介護・慶弔"),
    CHILDCARE_LEAVE("育児休業申請", "育児・介護・慶弔"),
    NURSING_CARE_LEAVE("介護休業申請", "育児・介護・慶弔"),
    BEREAVEMENT_LEAVE("忌引休暇申請", "育児・介護・慶弔"),

    // 勤怠
    OVERTIME("残業申請", "勤怠"),
    HOLIDAY_WORK("休日出勤申請", "勤怠"),
    EARLY_LEAVE("早退申請", "勤怠"),
    LATE_ARRIVAL("遅刻申請", "勤怠"),

    // 出張・テレワーク
    REMOTE_WORK("テレワーク申請", "出張・テレワーク"),
    BUSINESS_TRIP("出張申請", "出張・テレワーク"),

    // 経費・購買
    EXPENSE("経費精算申請", "経費・購買"),
    PURCHASE("備品購入申請", "経費・購買"),

    // その他
    TRAINING("研修申請", "その他"),
    COMMUTE_CHANGE("通勤経路変更申請", "その他"),
    SALARY_ADVANCE("給与前払い申請", "その他"),
    OTHER("その他", "その他");

    private final String label;
    private final String category;

}
