export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">이용약관</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">제1조 (목적)</h2>
          <p className="text-gray-700 leading-relaxed">
            본 약관은 배드톡(이하 &quot;회사&quot;)이 제공하는 배드민턴 모임 플랫폼 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여
            회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제2조 (정의)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ul className="list-decimal list-inside ml-4 space-y-2">
              <li>&quot;서비스&quot;란 회사가 제공하는 배드민턴 모임 매칭, 모임 관리, 커뮤니티 등의 온라인 서비스를 말합니다.</li>
              <li>&quot;회원&quot;이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.</li>
              <li>&quot;모임&quot;이란 회원이 서비스를 통해 생성하거나 참여하는 배드민턴 활동 그룹을 말합니다.</li>
              <li>&quot;게시물&quot;이란 회원이 서비스에 게시한 글, 사진, 동영상 등의 정보를 말합니다.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제3조 (약관의 효력 및 변경)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
            <p>② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며,
               변경된 약관은 제1항과 같은 방법으로 공지함으로써 효력이 발생합니다.</p>
            <p>③ 회원은 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제4조 (회원가입)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회원가입은 이용자가 약관의 내용에 동의하고, 회사가 정한 가입 양식에 따라 회원정보를 기입하여
               회원가입 신청을 하고 회사가 이를 승낙함으로써 체결됩니다.</p>
            <p>② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>타인의 명의를 이용한 경우</li>
              <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
              <li>관련 법령에 위배되거나 사회의 안녕질서 혹은 미풍양속을 저해할 목적으로 신청한 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제5조 (서비스의 제공 및 변경)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>배드민턴 모임 생성 및 검색 서비스</li>
              <li>모임 회원 관리 서비스</li>
              <li>커뮤니티 및 정보 공유 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ul>
            <p>② 회사는 서비스의 내용을 변경할 경우 그 사유를 회원에게 통지합니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제6조 (서비스의 중단)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는
               서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
            <p>② 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 회원 또는 제3자가 입은 손해에
               대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제7조 (회원의 의무)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회원은 다음 행위를 하여서는 안 됩니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>신청 또는 변경 시 허위 내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제8조 (게시물의 저작권)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다.</p>
            <p>② 회원이 서비스 내에 게시하는 게시물은 검색결과 내지 서비스 및 관련 프로모션 등에 노출될 수 있으며,
               해당 노출을 위해 필요한 범위 내에서는 일부 수정, 복제, 편집되어 게시될 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제9조 (회원탈퇴 및 자격 상실)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</p>
            <p>② 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>가입 신청 시에 허위 내용을 등록한 경우</li>
              <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
              <li>서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제10조 (책임제한)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는
               서비스 제공에 관한 책임이 면제됩니다.</p>
            <p>② 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
            <p>③ 회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며,
               그 밖에 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">제11조 (분쟁해결)</h2>
          <div className="text-gray-700 leading-relaxed space-y-2">
            <p>① 회사는 회원으로부터 제출되는 불만사항 및 의견을 우선적으로 처리합니다.</p>
            <p>② 회사와 회원 간 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제소합니다.</p>
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
