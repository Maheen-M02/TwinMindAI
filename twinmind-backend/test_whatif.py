import urllib.request, json

tests = [
    {'label': 'Temp +80',     'overrides': {'s4': 1490.0}},
    {'label': 'Pressure +3',  'overrides': {'s11': 51.5}},
    {'label': 'Both extreme', 'overrides': {'s4': 1490.0, 's11': 51.5, 's9': 9500.0}},
    {'label': 'No change',    'overrides': {}},
]

for t in tests:
    payload = {'machine_id': 'M1', 'sensor_overrides': t['overrides'], 'cycle': 100}
    req = urllib.request.Request(
        'http://localhost:8000/whatif',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    r = urllib.request.urlopen(req)
    d = json.loads(r.read())
    print(f"{t['label']:20} baseline={d['baseline']['failure_prob']:.3f}  whatif={d['whatif']['failure_prob']:.3f}  delta={d['delta_failure_prob']:+.3f}  status={d['whatif']['status']}")
