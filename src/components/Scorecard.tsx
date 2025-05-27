                      {isAddingMetricSignal !== bucket.name && (
                        <button
                          onClick={() => setIsAddingMetricSignal(bucket.name)}
                          className="h-6 w-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 hover:text-gray-500 transition-colors"
                          title="Add metric signal"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Show just the add button if no metrics exist yet */}
                {bucket.data.metricSignals.length === 0 && isAddingMetricSignal !== bucket.name && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Metric Signals</h3>
                    </div>
                    <button
                      onClick={() => setIsAddingMetricSignal(bucket.name)}
                      className="h-6 w-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 hover:text-gray-500 transition-colors"
                      title="Add metric signal"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )} 