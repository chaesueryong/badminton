import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 사이트 정보 */}
          <div>
            <h3 className="font-bold text-lg mb-3">배드메이트</h3>
            <p className="text-gray-600 text-sm">
              배드민턴 모임 찾기, 파트너 매칭,
              <br />
              체육관 정보까지 한곳에서
            </p>
          </div>

          {/* 법적 정보 */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-700">법적 고지</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-700">문의하기</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>이메일: contact@badmate.kr</li>
              <li>개인정보 관련: privacy@badmate.kr</li>
            </ul>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 배드메이트 (BadMate). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
