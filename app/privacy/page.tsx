export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">제1조 (개인정보의 처리 목적)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>배드톡(이하 &quot;회사&quot;)은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는
               다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라
               별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
            <ul className="list-decimal list-inside ml-4 space-y-2 mt-4">
              <li>
                <strong>회원 가입 및 관리</strong>
                <p className="ml-6 mt-1">회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리,
                   서비스 부정이용 방지, 각종 고지·통지 목적으로 개인정보를 처리합니다.</p>
              </li>
              <li>
                <strong>배드민턴 모임 서비스 제공</strong>
                <p className="ml-6 mt-1">모임 생성 및 관리, 모임 검색 및 매칭, 모임 참가 관리, 커뮤니티 서비스 제공 등의
                   목적으로 개인정보를 처리합니다.</p>
              </li>
              <li>
                <strong>서비스 개선 및 마케팅</strong>
                <p className="ml-6 mt-1">신규 서비스 개발 및 맞춤 서비스 제공, 통계학적 특성에 따른 서비스 제공 및 광고 게재,
                   이벤트 및 광고성 정보 제공 등의 목적으로 개인정보를 처리합니다.</p>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제2조 (개인정보의 처리 및 보유 기간)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은
               개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <p>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li><strong>회원 가입 및 관리:</strong> 회원 탈퇴 시까지. 다만, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는
                  해당 수사·조사 종료 시까지</li>
              <li><strong>전자상거래에서의 계약·청약철회 등에 관한 기록:</strong> 5년</li>
              <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년</li>
              <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년</li>
              <li><strong>표시·광고에 관한 기록:</strong> 6개월</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제3조 (처리하는 개인정보의 항목)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
            <ul className="list-decimal list-inside ml-4 space-y-3 mt-4">
              <li>
                <strong>회원가입 및 관리</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>필수항목: 이메일, 비밀번호, 닉네임</li>
                  <li>선택항목: 프로필 사진, 실력 급수, 활동 지역, 자기소개</li>
                </ul>
              </li>
              <li>
                <strong>모임 서비스 이용</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>모임 정보: 모임명, 활동지역, 참가비, 실력 급수, 모임 설명</li>
                  <li>참가 정보: 참가 신청 내역, 참가 상태</li>
                </ul>
              </li>
              <li>
                <strong>자동 수집 정보</strong>
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 기기 정보</li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제4조 (개인정보의 제3자 제공)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며,
               정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
            <p>② 회사는 현재 개인정보를 제3자에게 제공하고 있지 않습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제5조 (개인정보처리의 위탁)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
            <div className="ml-4 mt-2 space-y-2">
              <div className="border-l-4 border-gray-300 pl-4">
                <p><strong>수탁업체:</strong> Supabase Inc.</p>
                <p><strong>위탁업무 내용:</strong> 데이터베이스 관리 및 사용자 인증</p>
              </div>
            </div>
            <p className="mt-4">② 회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지,
               기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등
               문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
            <ul className="list-decimal list-inside ml-4 space-y-1 mt-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
            <p className="mt-4">② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며
               회사는 이에 대해 지체없이 조치하겠습니다.</p>
            <p>③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를
               완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제7조 (개인정보의 파기)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이
               해당 개인정보를 파기합니다.</p>
            <p>② 개인정보 파기의 절차 및 방법은 다음과 같습니다:</p>
            <ul className="list-decimal list-inside ml-4 space-y-2 mt-2">
              <li>
                <strong>파기절차:</strong> 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의
                승인을 받아 개인정보를 파기합니다.
              </li>
              <li>
                <strong>파기방법:</strong> 회사는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록
                파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제8조 (개인정보의 안전성 확보조치)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ul className="list-decimal list-inside ml-4 space-y-1 mt-2">
              <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
              <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화,
                  보안프로그램 설치</li>
              <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 &apos;쿠키(cookie)&apos;를
               사용합니다.</p>
            <p>② 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며
               이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.</p>
            <p>③ 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹브라우저에서 옵션을 설정함으로써
               모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제10조 (개인정보 보호책임자)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및
               피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
            <div className="ml-4 mt-4 border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50">
              <p><strong>개인정보 보호책임자</strong></p>
              <p className="mt-2">담당부서: 배드톡 운영팀</p>
              <p>이메일: privacy@badtalk.com</p>
            </div>
            <p className="mt-4">② 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리,
               피해구제 등에 관한 사항을 개인정보 보호책임자로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해
               지체없이 답변 및 처리해드릴 것입니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제11조 (권익침해 구제방법)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원
               개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-4">
              <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청: 1301 (www.spo.go.kr)</li>
              <li>경찰청: 182 (ecrm.cyber.go.kr)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제12조 (개인정보 처리방침 변경)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 이 개인정보 처리방침은 2025년 1월 1일부터 적용됩니다.</p>
            <p>② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.</p>
          </div>
        </section>

        <section className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            시행일자: 2025년 1월 1일
          </p>
        </section>
      </div>
    </div>
  );
}
