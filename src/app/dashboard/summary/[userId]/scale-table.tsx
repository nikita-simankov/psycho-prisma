interface Properties {
  strategy: string;
  testScaleResults: any;
}

export default function ScaleTable({
  strategy,
  testScaleResults,
}: Readonly<Properties>) {
  return (
    <table className="border">
      <tr>
        <th className="border">№ п/п</th>
        <th className="border">Шкала</th>
        <th className="border">Сырой балл</th>
        {strategy === "standard-ten" && <th>Значение СТЭН</th>}
        {strategy === "t-grade" && (
          <>
            <th>Т-Балл</th>
            <th>Корретированный балл</th>
          </>
        )}
      </tr>
      {testScaleResults.map((result: any) => (
        <tr>
          <td className="border">{result.scaleId}</td>
          <td className="border">{result.scaleName}</td>
          <td className="border">{result.scaleRawGradeValue}</td>
          {strategy === "standard-ten" && (
            <td className="border">{result.scaleStanValue}</td>
          )}
          {strategy === "t-grade" && (
            <>
              <td className="border">{result.scaleTGradeValue}</td>
              <td className="border">{result.scaleCorrectedGradeValue}</td>
            </>
          )}
        </tr>
      ))}
    </table>
  );
}
